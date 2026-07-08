using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Wallet;
using MumbaiTravelGuru.Application.Features.Wallet.Commands;
using MumbaiTravelGuru.Application.Features.Wallet.Queries;

namespace MumbaiTravelGuru.API.Controllers
{
    [Authorize]
    public class WalletController : ApiControllerBase
    {
        private readonly ICurrentUserService _currentUserService;

        public WalletController(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        [HttpGet("balance")]
        public async Task<ActionResult<WalletDto>> GetBalance()
        {
            var userId = _currentUserService.UserId;
            if (userId == null) return Unauthorized();

            var wallet = await Mediator.Send(new GetWalletQuery(userId.Value));
            if (wallet == null) return NotFound("Wallet not found.");

            return Ok(wallet);
        }

        [HttpGet("transactions")]
        public async Task<ActionResult<List<WalletTransactionDto>>> GetTransactions()
        {
            var userId = _currentUserService.UserId;
            if (userId == null) return Unauthorized();

            var transactions = await Mediator.Send(new GetWalletTransactionsQuery(userId.Value));
            return Ok(transactions);
        }

        [HttpPost("credit")]
        public async Task<ActionResult<WalletTransactionDto>> Credit([FromBody] CreditRequest request)
        {
            var userId = _currentUserService.UserId;
            if (userId == null) return Unauthorized();

            var command = new CreditWalletCommand(userId.Value, request.Amount, request.Description, request.ReferenceId);
            var transaction = await Mediator.Send(command);
            return Ok(transaction);
        }

        [HttpPost("debit")]
        public async Task<ActionResult<WalletTransactionDto>> Debit([FromBody] DebitRequest request)
        {
            var userId = _currentUserService.UserId;
            if (userId == null) return Unauthorized();

            var command = new DebitWalletCommand(userId.Value, request.Amount, request.Description, request.ReferenceId);
            var transaction = await Mediator.Send(command);
            return Ok(transaction);
        }
    }

    public record CreditRequest(decimal Amount, string Description, string ReferenceId = "");
    public record DebitRequest(decimal Amount, string Description, string ReferenceId = "");
}
